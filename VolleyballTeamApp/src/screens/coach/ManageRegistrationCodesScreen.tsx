import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Button, ListItem, Icon } from '@rneui/themed';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Text } from '../../components/Typography';
import { TABLES } from '../../constants/supabase';

interface RegistrationCode {
  id: string;
  code: string;
  role: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  status: 'active' | 'used' | 'expired';
  used_by: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function ManageRegistrationCodesScreen() {
  const { userProfile } = useAuth();
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCodes = async () => {
    try {
      if (!userProfile?.teamId) return;

      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CODES)
        .select(`
          *,
          used_by (
            first_name,
            last_name,
            email
          )
        `)
        .eq('team_id', userProfile.teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching registration codes:', error);
      Alert.alert('Error', 'Failed to load registration codes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRegistrationCode = async (role: string) => {
    try {
      if (!userProfile?.teamId) {
        Alert.alert('Error', 'You must be part of a team to create registration codes');
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Code expires in 7 days

      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CODES)
        .insert([
          {
            team_id: userProfile.teamId,
            code: generateCode(),
            role,
            created_by: userProfile.id,
            expires_at: expirationDate.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Registration code created! Share this code with the new team member.',
        [
          {
            text: 'Share Code',
            onPress: () => shareCode(data.code, role),
          },
          { text: 'OK' },
        ]
      );

      fetchCodes();
    } catch (error) {
      console.error('Error creating registration code:', error);
      Alert.alert('Error', 'Failed to create registration code');
    }
  };

  const shareCode = async (code: string, role: string) => {
    try {
      const message = `Join our volleyball team as a ${role}! Use registration code: ${code}\n\nThis code will expire in 7 days.`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCodes();
  };

  useEffect(() => {
    fetchCodes();
  }, [userProfile?.teamId]);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.buttonContainer}>
          <Text h3 style={styles.sectionTitle}>Create New Registration Code</Text>
          <View style={styles.roleButtons}>
            <Button
              title="For Coach"
              onPress={() => createRegistrationCode('coach')}
              containerStyle={styles.roleButton}
            />
            <Button
              title="For Player"
              onPress={() => createRegistrationCode('player')}
              containerStyle={styles.roleButton}
            />
            <Button
              title="For Parent"
              onPress={() => createRegistrationCode('parent')}
              containerStyle={styles.roleButton}
            />
          </View>
        </View>

        <View style={styles.codesContainer}>
          <Text h3 style={styles.sectionTitle}>Active Codes</Text>
          {codes
            .filter(code => code.status === 'active')
            .map(code => (
              <ListItem key={code.id} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title style={styles.codeText}>{code.code}</ListItem.Title>
                  <ListItem.Subtitle>
                    Role: {code.role}
                    {'\n'}
                    Expires: {format(new Date(code.expires_at), 'MMM dd, yyyy')}
                  </ListItem.Subtitle>
                </ListItem.Content>
                <TouchableOpacity
                  onPress={() => shareCode(code.code, code.role)}
                  style={styles.shareButton}
                >
                  <Icon name="share" type="material" />
                </TouchableOpacity>
              </ListItem>
            ))}

          <Text h3 style={[styles.sectionTitle, styles.usedTitle]}>Used Codes</Text>
          {codes
            .filter(code => code.status === 'used')
            .map(code => (
              <ListItem key={code.id} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{code.code}</ListItem.Title>
                  <ListItem.Subtitle>
                    Role: {code.role}
                    {'\n'}
                    Used by: {code.used_by?.first_name} {code.used_by?.last_name}
                    {'\n'}
                    Used on: {format(new Date(code.used_at!), 'MMM dd, yyyy')}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  codesContainer: {
    paddingHorizontal: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 18,
  },
  shareButton: {
    padding: 10,
  },
  usedTitle: {
    marginTop: 30,
  },
});
