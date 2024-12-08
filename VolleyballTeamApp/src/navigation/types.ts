export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

export type CoachStackParamList = {
  CoachTabs: undefined;
  CreateTeam: undefined;
  ManageTeam: undefined;
  ManageRegistrationCodes: undefined;
  AddEvent: undefined;
  EventDetails: { eventId: string };
  TeamPhoto: undefined;
  Resources: undefined;
  Chat: undefined;
  Calendar: undefined;
};

export type PlayerStackParamList = {
  PlayerTabs: undefined;
  EventDetails: { eventId: string };
  TeamPhoto: undefined;
  Resources: undefined;
  Chat: undefined;
  Calendar: undefined;
};

export type ParentStackParamList = {
  ParentTabs: undefined;
  EventDetails: { eventId: string };
  ChildStats: undefined;
  TeamPhoto: undefined;
  Resources: undefined;
  Chat: undefined;
  Calendar: undefined;
};
