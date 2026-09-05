import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuButton, MenuProvider } from '../components/AppMenu';
import { CatalogScreen } from '../screens/CatalogScreen';
import { DomainScreen } from '../screens/DomainScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { MedicationDetailScreen } from '../screens/MedicationDetailScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { ConsentProvider } from '../storage/consent';
import { colors, gradients } from '../theme';
import { FloatingTabBar } from './TabBar';
import type {
  AccueilStackParamList,
  CatalogueStackParamList,
  MedicamentsStackParamList,
  TabParamList,
} from './types';

export type {
  AccueilStackParamList,
  CatalogueStackParamList,
  DetailParamList,
  MedicamentsStackParamList,
  RootStackParamList,
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

const headerOptions: NativeStackNavigationOptions = {
  headerBackground: () => (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  ),
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '800', fontSize: 17 },
  headerShadowVisible: false,
  headerBackTitle: 'Retour',
  headerRight: () => <MenuButton />,
  contentStyle: { backgroundColor: colors.bg },
};

function AccueilStack() {
  return (
    <AccueilStackNav.Navigator screenOptions={headerOptions}>
      <AccueilStackNav.Screen
        name="AccueilHome"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <AccueilStackNav.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: 'Mentions légales' }}
      />
      <AccueilStackNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Fiche arrêté' }}
      />
      <AccueilStackNav.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: 'Médicament' }}
      />
    </AccueilStackNav.Navigator>
  );
}

function CatalogueStack() {
  return (
    <CatalogueStackNav.Navigator screenOptions={headerOptions}>
      <CatalogueStackNav.Screen
        name="CatalogueHome"
        component={CatalogScreen}
        options={{ title: 'Catalogue de l’arrêté' }}
      />
      <CatalogueStackNav.Screen name="Domain" component={DomainScreen} options={{ title: 'Domaine' }} />
      <CatalogueStackNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Fiche arrêté' }}
      />
      <CatalogueStackNav.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: 'Médicament' }}
      />
    </CatalogueStackNav.Navigator>
  );
}

function MedicamentsStack() {
  return (
    <MedicamentsStackNav.Navigator screenOptions={headerOptions}>
      <MedicamentsStackNav.Screen
        name="MedicamentsHome"
        component={MedicationsScreen}
        options={{ title: 'Liste IDE' }}
      />
      <MedicamentsStackNav.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: 'Médicament' }}
      />
      <MedicamentsStackNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Fiche arrêté' }}
      />
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
        <MenuProvider>
          <Tabs />
        </MenuProvider>
      </ConsentProvider>
    </NavigationContainer>
  );
}
