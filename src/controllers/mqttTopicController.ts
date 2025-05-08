import { Request, Response } from 'express';
import MqttTopic from '../models/mqttTopicModel';
import mqttHandler from '../services/mqttHandler';

export const createTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, description } = req.body;

    const existingTopic = await MqttTopic.findOne({ topic });
    if (existingTopic) {
      res.status(400).json({ message: '主题已存在' });
      return;
    }

    const newTopic = new MqttTopic({
      topic,
      description,
      isActive: true
    });

    await newTopic.save();
    await mqttHandler.subscribeToTopic(topic);

    res.status(201).json(newTopic);
  } catch (error) {
    res.status(500).json({ message: '创建主题失败', error });
  }
};

export const getTopics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const topics = await MqttTopic.find();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: '获取主题列表失败', error });
  }
};

export const updateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, description } = req.body;

    const topic = await MqttTopic.findById(id);
    if (!topic) {
      res.status(404).json({ message: '主题不存在' });
      return;
    }

    if (isActive !== undefined) {
      topic.isActive = isActive;
      if (isActive) {
        await mqttHandler.subscribeToTopic(topic.topic);
      } else {
        await mqttHandler.unsubscribeFromTopic(topic.topic);
      }
    }

    if (description) {
      topic.description = description;
    }

    await topic.save();
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: '更新主题失败', error });
  }
};

export const deleteTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const topic = await MqttTopic.findById(id);
    
    if (!topic) {
      res.status(404).json({ message: '主题不存在' });
      return;
    }

    await mqttHandler.unsubscribeFromTopic(topic.topic);
    await MqttTopic.findByIdAndDelete(id);
    
    res.json({ message: '主题已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除主题失败', error });
  }
}; 