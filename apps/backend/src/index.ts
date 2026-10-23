import app from './app';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║          AI Orchestration API Server Started                 ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  Environment: ${process.env.NODE_ENV || 'development'}                                      ║
  ║  Port: ${PORT}                                                ║
  ║  Host: ${HOST}                                                ║
  ║  API Base URL: http://localhost:${PORT}/api/v1               ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  Endpoints:                                                  ║
  ║    • POST   /api/v1/auth/login                              ║
  ║    • POST   /api/v1/auth/register                           ║
  ║    • GET    /api/v1/models                                  ║
  ║    • POST   /api/v1/models                                  ║
  ║    • GET    /api/v1/prompts                                 ║
  ║    • POST   /api/v1/prompts                                 ║
  ║    • GET    /api/v1/datasets                                ║
  ║    • POST   /api/v1/datasets                                ║
  ║    • GET    /api/v1/training-jobs                           ║
  ║    • POST   /api/v1/training-jobs                           ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});
