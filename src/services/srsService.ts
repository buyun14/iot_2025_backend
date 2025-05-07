import axios from 'axios';
import srsConfig from '../config/srsConfig';
import Camera from '../models/cameraModel';

interface Stream {
    vhost: string;
    app: string;
    stream: string;
    param: string;
    server_id: string;
    client_id: string;
    update: string;
}

interface SRSResponse {
    code: number;
    data: {
        streams: Stream[];
    };
}

class SRSService {
    private baseUrl: string;
    private apiToken: string;

    // 构造函数
    constructor() {
        this.baseUrl = srsConfig.srsServer.baseUrl;
        this.apiToken = srsConfig.srsServer.apiToken;
    }

    // 获取流
    async getStreams(): Promise<Stream[]> {
        try {
            const response = await axios.post<SRSResponse>(
                `${this.baseUrl}/terraform/v1/mgmt/streams/query`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.code === 0) {
                return response.data.data.streams;
            }
            throw new Error('Failed to fetch streams from SRS');
        } catch (error) {
            console.error('Error fetching streams:', error);
            throw error;
        }
    }

    // 同步流到数据库
    async syncStreamsWithDatabase(): Promise<Stream[]> {
        try {
            const streams = await this.getStreams();
            
            for (const stream of streams) {
                await Camera.findOneAndUpdate(
                    { 'streamInfo.stream': stream.stream },
                    {
                        $set: {
                            'streamInfo': {
                                vhost: stream.vhost,
                                app: stream.app,
                                stream: stream.stream,
                                param: stream.param,
                                serverId: stream.server_id,
                                clientId: stream.client_id,
                                lastUpdate: new Date(stream.update)
                            },
                            status: 'online',
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            // 标记数据库中不存在的流为离线
            const activeStreams = streams.map(s => s.stream);
            await Camera.updateMany(
                { 'streamInfo.stream': { $nin: activeStreams } },
                { 
                    $set: { 
                        status: 'offline',
                        updatedAt: new Date()
                    }
                }
            );

            return streams;
        } catch (error) {
            console.error('Error syncing streams with database:', error);
            throw error;
        }
    }

    // 获取流URL
    getStreamUrl(streamName: string, type: 'flv' | 'hls' | 'webrtc' = 'flv'): string {
        const { playerConfig } = srsConfig;
        switch (type.toLowerCase()) {
            case 'flv':
                return playerConfig.flvPlayerUrl.replace('{stream}', streamName);
            case 'hls':
                return playerConfig.hlsPlayerUrl.replace('{stream}', streamName);
            case 'webrtc':
                return playerConfig.webrtcPlayerUrl.replace('{stream}', streamName);
            default:
                throw new Error('Unsupported stream type');
        }
    }
}

export default new SRSService(); 