import express from 'express';
import {
  createTopic,
  getTopics,
  updateTopic,
  deleteTopic
} from '../controllers/mqttTopicController';

const router = express.Router();

router.post('/', createTopic);
router.get('/', getTopics);
router.put('/:id', updateTopic);
router.delete('/:id', deleteTopic);

export default router; 