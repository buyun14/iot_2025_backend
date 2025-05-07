import app from './app';

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 