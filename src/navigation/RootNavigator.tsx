import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { CatalogScreen } from '../screens/CatalogScreen';
import { DomainScreen } from '../screens/DomainScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { MedicationDetailScreen } from '../screens/MedicationDetailScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { ConsentProvider } from '../storage/consent';
import { colors } from '../theme';
import { FloatingTabBar } from './TabBar';
import type {
  AccueilStackParamList,
  CatalogueStackParamList,
  MedicamentsStackParamList,
  TabParamList,
} from './types';

const AccueilStackNav = createNativeStackNavigator<AccueilStackParamList>();
const CatalogueStackNav = createNativeStackNavigator<CatalogueStackParamList>();
const MedicamentsStackNav = createNativeStackNavigator<MedicamentsStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.bg,
    card: colors.bgHero,
    text: colors.ink,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '600' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

const stackOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
};

function AccueilStack() {
  return (
    <AccueilStackNav.Navigator screenOptions={stackOptions}>
      <AccueilStackNav.Screen name="AccueilHome" component={HomeScreen} />
      <AccueilStackNav.Screen name="Legal" component={LegalScreen} />
      <AccueilStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
      <AccueilStackNav.Screen name="MedicationDetail" component={MedicationDetailScreen} />
    </AccueilStackNav.Navigator>
  );
}

function CatalogueStack() {
  return (
    <CatalogueStackNav.Navigator screenOptions={stackOptions}>
      <CatalogueStackNav.Screen name="CatalogueHome" component={CatalogScreen} />
      <CatalogueStackNav.Screen name="Domain" component={DomainScreen} />
      <CatalogueStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
      <CatalogueStackNav.Screen name="MedicationDetail" component={MedicationDetailScreen} />
    </CatalogueStackNav.Navigator>
  );
}

function MedicamentsStack() {
  return (
    <MedicamentsStackNav.Navigator screenOptions={stackOptions}>
      <MedicamentsStackNav.Screen name="MedicamentsHome" component={MedicationsScreen} />
      <MedicamentsStackNav.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <MedicamentsStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
    </MedicamentsStackNav.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Accueil" component={AccueilStack} />
      <Tab.Screen name="Catalogue" component={CatalogueStack} />
      <Tab.Screen name="Medicaments" component={MedicamentsStack} />
    </Tab.Navigator>
  );
}

export function RootNavigator({ onReviewTerms }: { onReviewTerms: () => void }) {
  return (
    <NavigationContainer theme={navigationTheme}>
      <ConsentProvider onReviewTerms={onReviewTerms}>
        <Tabs />
      </ConsentProvider>
    </NavigationContainer>
  );
}
