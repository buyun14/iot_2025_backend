// config\mqtt.js
//为了提高可维护性，可以将 MQTT 的连接信息抽取到配置文件中。(可选)
module.exports = {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    topics: {
      sensorData: 'sensor/data',
    },
  };