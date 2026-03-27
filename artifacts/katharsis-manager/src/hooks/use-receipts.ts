import { useQueryClient } from "@tanstack/react-query";
import {
  useListReceipts,
  useCreateReceipt,
  getListReceiptsQueryKey,
} from "@workspace/api-client-react";

export function useReceipts() {
  return useListReceipts();
}

export function useCreateNewReceipt() {
  const queryClient = useQueryClient();
  return useCreateReceipt({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReceiptsQueryKey() });
      },
    },
  });
}
