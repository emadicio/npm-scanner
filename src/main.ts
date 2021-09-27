import App from '@/app';

const main = async () => {
  const app = new App();
  await app.init();
  app.listen();
};
main();
