exports.getServerIds = () => {
  const serverEnvKeys = Object.keys(process.env).filter((key) =>
    key.startsWith('SERVER_')
  );

  return [
    ...new Set(
      serverEnvKeys
        .map((key) => {
          const match = key.match(/^SERVER_([A-Z0-9_]+)_/);
          return match ? match[1] : null;
        })
        .map((key) => key.replace(/^SERVER_/, '').split('_')[0])
        .filter((id) => id !== null))
  ]
}
