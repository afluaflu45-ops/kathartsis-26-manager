import { useQueryClient } from "@tanstack/react-query";
import {
  useListStickers,
  useCreateSticker,
  useDeleteSticker,
  getListStickersQueryKey,
} from "@workspace/api-client-react";

export function useStickers() {
  return useListStickers();
}

export function useCreateNewSticker() {
  const queryClient = useQueryClient();
  return useCreateSticker({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
      },
    },
  });
}

export function useDeleteExistingSticker() {
  const queryClient = useQueryClient();
  return useDeleteSticker({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
      },
    },
  });
}
