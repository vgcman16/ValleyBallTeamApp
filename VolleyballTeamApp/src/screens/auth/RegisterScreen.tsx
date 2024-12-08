import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, Button } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { Text } from '../../components/Typography';
import { TABLES } from '../../constants/supabase';
import { validatePassword, getPasswordStrengthColor } from '../../utils/passwordValidation';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ['Enter a password'],
    isStrong: false,
  });

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(validatePassword(text));
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !registrationCode.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!passwordStrength.isStrong) {
      Alert.alert('Weak Password', 'Please choose a stronger password:\n' + passwordStrength.feedback.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      // First, verify the registration code
      const { data: codeData, error: codeError } = await supabase
        .from(TABLES.REGISTRATION_CODES)
        .select('*')
        .eq('code', registrationCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (codeError || !codeData) {
        Alert.alert('Error', 'Invalid or expired registration code');
        return;
      }

      if (new Date(codeData.expires_at) < new Date()) {
        Alert.alert('Error', 'This registration code has expired');
        return;
      }

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            role: codeData.role,
          },
          emailRedirectTo: 'volleyballteamapp://login',
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create the user profile
        const { error: profileError } = await supabase
          .from(TABLES.USERS)
          .insert([
            {
              id: authData.user.id,
              email,
              first_name: firstName,
              last_name: lastName,
              role: codeData.role,
              team_id: codeData.team_id,
              registration_code: codeData.id,
            },
          ]);

        if (profileError) throw profileError;

        // Update the registration code
        const { error: updateError } = await supabase
          .from(TABLES.REGISTRATION_CODES)
          .update({
            status: 'used',
            used_by: authData.user.id,
            used_at: new Date().toISOString(),
          })
          .eq('id', codeData.id);

        if (updateError) throw updateError;
      }

      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account before signing in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error during registration:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text h2 style={styles.title}>Create Account</Text>

        <Input
          placeholder="Registration Code"
          value={registrationCode}
          onChangeText={setRegistrationCode}
          autoCapitalize="characters"
          disabled={isLoading}
        />

        <Input
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          disabled={isLoading}
        />

        <Input
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          disabled={isLoading}
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          disabled={isLoading}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          disabled={isLoading}
        />

        <View style={styles.passwordStrength}>
          <View 
            style={[
              styles.strengthBar,
              { 
                width: `${(passwordStrength.score / 5) * 100}%`,
                backgroundColor: getPasswordStrengthColor(passwordStrength.score)
              }
            ]} 
          />
        </View>

        <View style={styles.feedbackContainer}>
          {passwordStrength.feedback.map((feedback, index) => (
            <Text
              key={index}
              style={[
                styles.feedbackText,
                {
                  color: passwordStrength.isStrong ? '#007E33' : '#ff4444'
                }
              ]}
            >
              {feedback}
            </Text>
          ))}
        </View>

        <Button
          title={isLoading ? 'Creating Account...' : 'Create Account'}
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading || !passwordStrength.isStrong}
          containerStyle={styles.buttonContainer}
        />

        <Button
          title="Back to Login"
          type="clear"
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        />
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
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  passwordStrength: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  feedbackContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    marginVertical: 10,
  },
});
