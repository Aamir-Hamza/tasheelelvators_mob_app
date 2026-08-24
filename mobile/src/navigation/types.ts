import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Elevators: undefined;
  Emergency: undefined;
  Maintenance: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ElevatorDetail: { id: string };
  Telemetry: { id: string };
  Checklist: { id: string };
};
