import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { NOTES_URL } from '../constants/api';

export type Note = {
  id: number;
  user_id: string;
  account_id: number;
  content: string;
  created_at: string;
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotes = useCallback(async (accountId: number | string) => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${NOTES_URL}/account/${accountId}`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заметки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNote = async (userId: string, accountId: number | string, content: string) => {
    try {
      const response = await fetch(`${NOTES_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, account_id: accountId, content }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      const created = await response.json();
      setNotes((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Ошибка', 'Не удалось создать заметку');
      return null;
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const response = await fetch(`${NOTES_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Ошибка', 'Не удалось удалить заметку');
    }
  };

  return { notes, isLoading, loadNotes, createNote, deleteNote };
};
