import { useQueryClient } from "@tanstack/react-query";
import {
  useListCertificates,
  useCreateCertificate,
  useDeleteCertificate,
  getListCertificatesQueryKey,
} from "@workspace/api-client-react";

export function useCertificates() {
  return useListCertificates();
}

export function useCreateNewCertificate() {
  const queryClient = useQueryClient();
  return useCreateCertificate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
      },
    },
  });
}

export function useDeleteExistingCertificate() {
  const queryClient = useQueryClient();
  return useDeleteCertificate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
      },
    },
  });
}
