export const linking = {
  prefixes: ['volleyballteamapp://', 'https://volleyballteamapp.com'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      EmailConfirmation: 'confirm-email',
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Calendar: 'calendar',
          Team: 'team',
          Tactics: 'tactics',
          Chat: 'chat',
          Resources: 'resources',
        },
      },
    },
  },
};
