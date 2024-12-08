import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants/supabase';
import { Picker } from '@react-native-picker/picker';
import { Text } from '../../components/Typography';

export default function SignupScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: USER_ROLES.PLAYER,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
      
      if (error) throw error;
      
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email for verification.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title} h3>
            Create Account
          </Text>
          <Text style={styles.subtitle}>
            Join your volleyball team
          </Text>

          <Input
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(value) => setFormData({ ...formData, firstName: value })}
            leftIcon={{ type: 'material', name: 'person' }}
          />

          <Input
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(value) => setFormData({ ...formData, lastName: value })}
            leftIcon={{ type: 'material', name: 'person' }}
          />

          <Input
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => setFormData({ ...formData, email: value })}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={{ type: 'material', name: 'email' }}
          />

          <Input
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => setFormData({ ...formData, password: value })}
            secureTextEntry
            leftIcon={{ type: 'material', name: 'lock' }}
          />

          <Input
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
            secureTextEntry
            leftIcon={{ type: 'material', name: 'lock' }}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Role:</Text>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              style={styles.picker}
            >
              <Picker.Item label="Player" value={USER_ROLES.PLAYER} />
              <Picker.Item label="Coach" value={USER_ROLES.COACH} />
              <Picker.Item label="Parent" value={USER_ROLES.PARENT} />
            </Picker>
          </View>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            containerStyle={styles.buttonContainer}
          />

          <Button
            title="Already have an account? Sign In"
            type="clear"
            onPress={() => navigation.navigate('Login')}
            containerStyle={styles.buttonContainer}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
    marginLeft: 10,
  },
  picker: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  buttonContainer: {
    marginVertical: 10,
  },
});
