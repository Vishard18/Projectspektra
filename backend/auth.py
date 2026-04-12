import os

from azure.identity import DefaultAzureCredential, ManagedIdentityCredential


def get_azure_credential():
    client_id = os.getenv("AZURE_CLIENT_ID")
    resource_id = os.getenv("UAMI_RESOURCE_ID")

    if resource_id:
        return ManagedIdentityCredential(identity_config={"resource_id": resource_id})

    if client_id:
        return ManagedIdentityCredential(client_id=client_id)

    return DefaultAzureCredential()
