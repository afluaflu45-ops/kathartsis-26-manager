import { useQueryClient } from "@tanstack/react-query";
import {
  useListTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useGetFinanceSummary,
  getListTransactionsQueryKey,
  getGetFinanceSummaryQueryKey,
} from "@workspace/api-client-react";

export function useFinance() {
  return useListTransactions();
}

export function useFinanceSummary() {
  return useGetFinanceSummary();
}

export function useCreateFinanceTx() {
  const queryClient = useQueryClient();
  return useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
      },
    },
  });
}

export function useDeleteFinanceTx() {
  const queryClient = useQueryClient();
  return useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
      },
    },
  });
}
