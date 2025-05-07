interface MQTTConfig {
  brokerUrl: string;
  username: string;
  password: string;
  topics: {
    sensorData: string;
  };
}

const mqttConfig: MQTTConfig = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost',
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  topics: {
    sensorData: 'sensor/data',
  },
};

export default mqttConfig; 