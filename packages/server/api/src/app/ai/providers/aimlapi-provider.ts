import { AIMLAPI_ATTRIBUTION_HEADERS, AIMLAPI_BASE_URL, AIMLAPI_CHAT_MODEL_TYPE } from '@activepieces/core-piece-types'
import { safeHttp } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, BaseAIProviderAuthConfig, isNil, OpenAiCompatibleVendorConfig, tryCatch } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

const AIMLAPI_DISPLAY_NAME = 'aimlapi.com'

const REQUEST_TIMEOUT_MS = 15_000

export const aimlapiProvider: AIProviderStrategy<BaseAIProviderAuthConfig, OpenAiCompatibleVendorConfig> = {
    name: AIMLAPI_DISPLAY_NAME,
    async validateConnection(authConfig: BaseAIProviderAuthConfig): Promise<void> {
        const { error } = await tryCatch(() => safeHttp.axios.request({
            method: 'GET',
            url: `${AIMLAPI_BASE_URL}/key`,
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                ...AIMLAPI_ATTRIBUTION_HEADERS,
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        }))

        if (!isNil(error)) {
            throw new Error(`[${AIMLAPI_DISPLAY_NAME}] failed to validate the api key: ${error instanceof Error ? error.message : String(error)}`)
        }
    },
    async listModels(): Promise<AIProviderModel[]> {
        const { data: response, error } = await tryCatch(() => safeHttp.axios.request<AimlapiModelsResponse>({
            method: 'GET',
            url: `${AIMLAPI_BASE_URL}/models`,
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                ...AIMLAPI_ATTRIBUTION_HEADERS,
                'Content-Type': 'application/json',
            },
        }))

        if (!isNil(error) || isNil(response)) {
            throw new Error(`[${AIMLAPI_DISPLAY_NAME}] failed to list models: ${error instanceof Error ? error.message : String(error)}`)
        }

        return (response.data.data ?? [])
            .filter((model) => model.type === AIMLAPI_CHAT_MODEL_TYPE)
            .map((model) => ({
                id: model.id,
                name: model.id,
                type: AIProviderModelType.TEXT,
            }))
    },
}

type AimlapiModelsResponse = {
    data?: { id: string, type?: string }[]
}
