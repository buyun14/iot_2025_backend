interface SRSServerConfig {
  baseUrl: string;
  apiVersion: string;
  apiToken: string;
  rtmpPort: number;
  httpPort: number;
}

interface StreamConfig {
  defaultApp: string;
  defaultVhost: string;
  streamSecret: string;
}

interface PlayerConfig {
  flvPlayerUrl: string;
  hlsPlayerUrl: string;
  webrtcPlayerUrl: string;
}

interface SRSConfig {
  srsServer: SRSServerConfig;
  streamConfig: StreamConfig;
  playerConfig: PlayerConfig;
}

const srsConfig: SRSConfig = {
  srsServer: {
    baseUrl: process.env.SRS_SERVER_URL || 'http://10.60.90.192:2022',
    apiVersion: 'v1',
    apiToken: process.env.SRS_API_TOKEN || 'srs-v2-a1f1bc2a53014c05bb88c3921ef5dc8d',
    rtmpPort: Number(process.env.SRS_RTMP_PORT) || 1935,
    httpPort: Number(process.env.SRS_HTTP_PORT) || 2022
  },
  streamConfig: {
    defaultApp: 'live',
    defaultVhost: '__defaultVhost__',
    streamSecret: process.env.SRS_STREAM_SECRET || 'cc1a776e98314022bc58c9f55cc89d9b'
  },
  playerConfig: {
    flvPlayerUrl: process.env.SRS_FLV_PLAYER_URL || 'http://10.60.90.192:2022/live/{stream}.flv',
    hlsPlayerUrl: process.env.SRS_HLS_PLAYER_URL || 'http://10.60.90.192:2022/live/{stream}.m3u8',
    webrtcPlayerUrl: process.env.SRS_WEBRTC_PLAYER_URL || 'http://10.60.90.192:2022/rtc/v1/whep/?app=live&stream={stream}'
  }
};

export default srsConfig; 