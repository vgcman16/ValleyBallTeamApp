import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Input, Button, Avatar, ListItem } from 'react-native-elements';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { Message, User } from '../../types';
import { subscribeToTeamChat, sendMessage, fetchMessages } from '../../services/chat';
import { USER_ROLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user?.teamId) {
      loadInitialMessages();
      const unsubscribe = subscribeToTeamChat(user.teamId, handleNewMessage);
      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const loadInitialMessages = async () => {
    if (!user?.teamId) return;
    
    try {
      const initialMessages = await fetchMessages(user.teamId);
      setMessages(initialMessages);
      setHasMore(initialMessages.length === 50);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !user?.teamId) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[messages.length - 1];
      const moreMessages = await fetchMessages(
        user.teamId,
        50,
        oldestMessage.created_at
      );
      setMessages([...messages, ...moreMessages]);
      setHasMore(moreMessages.length === 50);
    } catch (error) {
      Alert.alert('Error', 'Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages((prevMessages) => [message, ...prevMessages]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.teamId) return;

    try {
      await sendMessage(
        user.teamId,
        user.id,
        newMessage,
        user.role === USER_ROLES.COACH ? 'announcement' : 'chat'
      );
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const sender = item.sender as User;

    return (
      <ListItem
        containerStyle={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar
            rounded
            title={`${sender.first_name[0]}${sender.last_name[0]}`}
            containerStyle={[
              styles.avatar,
              item.type === 'announcement' && styles.coachAvatar,
            ]}
          />
        )}
        <ListItem.Content
          style={isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent}
        >
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>
              {isOwnMessage ? 'You' : `${sender.first_name} ${sender.last_name}`}
              {item.type === 'announcement' && ' (Coach)'}
            </Text>
            <Text style={styles.messageTime}>
              {format(new Date(item.created_at), 'h:mm a')}
            </Text>
          </View>
          <Text style={styles.messageText}>{item.content}</Text>
        </ListItem.Content>
      </ListItem>
    );
  };

  if (!user?.teamId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>You need to be part of a team to use the chat.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.loadingMore} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No messages yet. Start a conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          containerStyle={styles.input}
          multiline
        />
        <Button
          title="Send"
          onPress={handleSendMessage}
          containerStyle={styles.sendButton}
          disabled={!newMessage.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  ownMessage: {
    backgroundColor: '#e3f2fd',
    marginLeft: 50,
  },
  otherMessage: {
    backgroundColor: '#f5f5f5',
    marginRight: 50,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  otherMessageContent: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  senderName: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
  },
  avatar: {
    backgroundColor: '#2089dc',
    marginRight: 10,
  },
  coachAvatar: {
    backgroundColor: '#f50057',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginBottom: 0,
  },
  sendButton: {
    width: 70,
  },
  loadingMore: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
