import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useTransactions = (userId, accountId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expenses: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!accountId) return;
    const response = await fetch(`${API_URL}/transactions/${userId}/${accountId}`);
    const data = await response.json();
    setTransactions(data);
  }, [userId, accountId]);

  const fetchSummary = useCallback(async () => {
    if (!accountId) return;
    const response = await fetch(`${API_URL}/transactions/summary/${userId}/${accountId}`);
    const data = await response.json();
    setSummary(data);
  }, [userId, accountId]);

  const loadData = useCallback(async () => {
    if (!userId || !accountId) return;
    setIsLoading(true);
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId, accountId]);

  const createTransaction = async ({ title, amount, category }) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category, user_id: userId, account_id: accountId }),
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
