import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expenses: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const response = await fetch(`${API_URL}/transactions/${userId}`);
    const data = await response.json();
    setTransactions(data);
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    const response = await fetch(`${API_URL}/transactions/summary/${userId}`);
    const data = await response.json();
    setSummary(data);
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  const createTransaction = async ({ title, amount, category }) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category, user_id: userId }),
      });
      if (!response.ok) throw new Error("Failed to create transaction");
      return true;
    } catch (error) {
      console.error("Error creating transaction:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  };

  const updateTransaction = async (id, { title, amount, category }) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category }),
      });
      if (!response.ok) throw new Error("Failed to update transaction");
      await loadData();
      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete transaction");
      loadData();
      Alert.alert("Success", "Transaction deleted");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { transactions, summary, isLoading, loadData, createTransaction, updateTransaction, deleteTransaction };
};
