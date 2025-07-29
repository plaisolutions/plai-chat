import { cookies } from "next/headers"

import type { User, UserUpdate } from "@/types/users"
import type {
  EditMembershipRole,
  Organization,
  OrganizationCreate,
  OrganizationMembership,
  OrganizationWithMembership,
  Invitation,
  invitationWithOrganization,
  InvitationCreate,
  OrganizationMember,
} from "@/types/organizations"
import type {
  Project,
  ProjectCreate,
  ProjectStats,
  Member,
  MembershipUpdate,
  MembershipDelete,
  ProjectMembership,
} from "@/types/projects"
import type { Agent, AgentCreate } from "@/types/agents"
import type { ModelsApiResponse } from "@/types/llms"
import type {
  Datasource,
  DatasourceCreate,
  DatasourceUpdate,
  Resource,
  ResourceListResponse,
  ResourceCreate,
  ResourceUpdate,
} from "@/types/datasources"
import type { Tool, ToolCreate, ToolUpdate } from "@/types/tools"
import type { Batch } from "@/types/batches"
import type {
  RequestsByDay,
  ThreadsByDay,
  LLMUsage,
  RerankUsage,
  WebsearchUsage,
  EmbeddingsUsage,
  ScrapingUsage,
  TranscriptionUsage,
} from "@/types/api"
import type { ScrapingStatus } from "@/types/scraping"

// Tipos para BigQuery
export interface BigQueryDatasetsResponse {
  datasets: Array<{
    id: string
    name: string
    projectId: string
  }>
}

export interface BigQueryTablesResponse {
  tables: Array<{
    id: string
    name: string
    type: string
  }>
}

// Tipo para las credenciales de BigQuery
export type BigQueryCredentials = Record<string, any>

import type {
  AnswerFilter,
  AnswerFilterCreate,
  AnswerFilterListResponse,
  AnswerFilterUpdate,
  AnswerFilterDelete,
  GuardrailListResponse,
  AgentGuardrail,
  AgentGuardrailListResponse,
  AgentGuardrailCreate,
  AgentGuardrailDelete,
} from "@/types/agents"

export type APIError = {
  body: string
  detail?: string
  status: number
}

export class Api {
  private token?: string
  private projectToken?: string

  constructor(token?: string, projectToken?: string) {
    try {
      const cookieStore = cookies()
      const jwt = cookieStore.get("user_jwt")?.value

      if (!jwt) console.warn("No user JWT token found in cookies")
      this.token = jwt

      this.projectToken = cookieStore.get("project_jwt")?.value
    } catch (error) {
      console.warn("Error accessing cookies:", error)
    }

    if (projectToken) {
      this.projectToken = projectToken
    }

    if (token) {
      this.token = token
    }

    if (projectToken || token) {
      return
    }
  }

  protected async fetchFromApi<T>(
    endpoint: string,
    options: RequestInit = {},
    searchParams: Record<string, any> = {},
    timeoutMs: number = 30000, // Timeout por defecto de 30 segundos
  ) {
    const url = new URL(`${process.env.NEXT_PUBLIC_PLAI_API_URL}${endpoint}`)

    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    // Preparar los headers base
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Añadir el token de autorización si existe
    if (this.token) {
      headers.authorization = `Bearer ${this.token}`
    }

    // Configurar AbortController para el timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      // Limpiar el timeout ya que la solicitud se completó
      clearTimeout(timeoutId)

      let error: APIError | null = null

      if (!response.ok) {
        const responseBody = await response.text()
        const errorMessage = `
          Error while trying to fetch ${endpoint} [status: ${response.status}]: ${responseBody}
        `
        console.error(`API error: ${errorMessage}`)

        error = {
          body: errorMessage,
          status: response.status,
        }

        // Check if response status is in the range of 400s
        if (response.status >= 400 && response.status < 500) {
          const responseObject = JSON.parse(responseBody)
          if (responseObject.detail) error.detail = responseObject.detail
        }

        return { data: null, error }
      }

      if (options.method === "DELETE") {
        return { data: null, error }
      }

      const data: T = await response.json()
      return { data, error }
    } catch (error: unknown) {
      // Limpiar el timeout en caso de error
      clearTimeout(timeoutId)

      // Manejar específicamente el error de timeout (AbortError)
      if (error instanceof Error && error.name === "AbortError") {
        const errorMessage = `Timeout of ${timeoutMs}ms exceeded while trying to fetch ${endpoint}`
        console.error(errorMessage)

        return {
          data: null,
          error: {
            body: errorMessage,
            status: 408, // Request Timeout
          },
        }
      }

      // Manejar otros errores
      console.error(`Error while trying to fetch ${endpoint}:`, error)

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"

      return {
        data: null,
        error: {
          body: errorMessage,
          status: 500,
        },
      }
    }
  }

  async getMe() {
    return this.fetchFromApi<User>("/me")
  }

  async patchMe(payload: UserUpdate) {
    return this.fetchFromApi<User>("/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async createOrganization(payload: OrganizationCreate) {
    return await this.fetchFromApi<Organization>("/organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async getOrganizations() {
    return await this.fetchFromApi<OrganizationWithMembership[]>(
      "/organizations",
    )
  }

  async getOrganization(id: string) {
    return await this.fetchFromApi<OrganizationWithMembership>(
      `/organizations/${id}`,
    )
  }

  async updateOrganization(id: string, payload: OrganizationCreate) {
    return await this.fetchFromApi<Organization>(`/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async getOrganizationMemberships(id: string) {
    return await this.fetchFromApi<OrganizationMember[]>(
      `/organizations/${id}/memberships`,
    )
  }

  async patchOrganizationMembership(payload: EditMembershipRole) {
    return await this.fetchFromApi<OrganizationMembership>(
      `/organizations/${payload.organization_id}/memberships/${payload.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    )
  }

  async createProject(payload: ProjectCreate) {
    return this.fetchFromApi(
      `/organizations/${payload.organization_id}/projects`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    )
  }

  async getProjects(organizationId: string) {
    return this.fetchFromApi<Project[]>(
      `/organizations/${organizationId}/projects`,
    )
  }

  async getProject(organizationId: string, projectId: string) {
    return this.fetchFromApi<Project>(
      `/organizations/${organizationId}/projects/${projectId}`,
    )
  }

  async patchProject(organizationId: string, projectId: string, payload: any) {
    return this.fetchFromApi<Project>(
      `/organizations/${organizationId}/projects/${projectId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getProjectStats(organizationId: string, projectId: string) {
    return this.fetchFromApi<ProjectStats>(
      `/organizations/${organizationId}/projects/${projectId}/stats`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getProjectMembers(organizationId: string, projectId: string) {
    return this.fetchFromApi<Member[]>(
      `/organizations/${organizationId}/projects/${projectId}/members`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async patchProjectMembership(payload: MembershipUpdate) {
    const { organization_id, project_id, membership_id, role } = payload
    return this.fetchFromApi<ProjectMembership>(
      `/organizations/${organization_id}/projects/${project_id}/memberships/${membership_id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role: role }),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async deleteProjectMembership(payload: MembershipDelete) {
    const { organization_id, project_id, membership_id } = payload
    return this.fetchFromApi(
      `/organizations/${organization_id}/projects/${project_id}/memberships/${membership_id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async createAgent(payload: AgentCreate) {
    return this.fetchFromApi<Agent>(`/agents`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getAgents() {
    return this.fetchFromApi<Agent[]>(`/agents`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getAgent(agentId: string) {
    console.log("GETTING AGENT", agentId)
    console.log("PROJECT TOKEN", this.projectToken)

    return this.fetchFromApi<Agent>(`/agents/${agentId}`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async patchAgent(projectId: string, agentId: string, payload: any) {
    return this.fetchFromApi(`/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async deleteAgent(agentId: string) {
    return this.fetchFromApi(`/agents/${agentId}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async rateMessage(agentId: string, messageId: string, rating: string) {
    return this.fetchFromApi(`/agents/${agentId}/rate`, {
      method: "POST",
      body: JSON.stringify({
        agent_id: agentId,
        message_id: messageId,
        rating,
      }),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async createAgentTool(agentId: string, toolId: string) {
    return this.fetchFromApi(`/agents/${agentId}/tools`, {
      method: "POST",
      body: JSON.stringify({ toolId }),
    })
  }

  async getAgentTools(agentId: string) {
    return this.fetchFromApi<Tool[]>(`/agents/${agentId}/tools`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getAgentDatasources(agentId: string) {
    return this.fetchFromApi<Datasource[]>(`/agents/${agentId}/datasources`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async createApiKey(email: string) {
    return this.fetchFromApi("/api-users", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async createDatasource(payload: DatasourceCreate) {
    return this.fetchFromApi<Datasource>(`/datasources`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async createAgentDatasource(
    projectId: string,
    agentId: string,
    datasourceId: string,
  ) {
    return this.fetchFromApi(
      `/projects/${projectId}/agents/${agentId}/datasources`,
      {
        method: "POST",
        body: JSON.stringify({ datasourceId }),
      },
    )
  }

  async getInvitations(organizationId: string) {
    return this.fetchFromApi<Invitation[]>(
      `/organizations/${organizationId}/invitations`,
    )
  }

  async createInvitation(payload: InvitationCreate) {
    console.log(payload)
    return this.fetchFromApi<Invitation>(
      `/organizations/${payload.organization_id}/invitations`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    )
  }

  async deleteInvitation(organizationId: string, invitationId: string) {
    return this.fetchFromApi(
      `/organizations/${organizationId}/invitations/${invitationId}`,
      {
        method: "DELETE",
      },
    )
  }

  async getMyInvitations() {
    return this.fetchFromApi<invitationWithOrganization[]>(`/me/invitations`)
  }

  async replyToInvitation(invitationId: string, accept: boolean) {
    return this.fetchFromApi<OrganizationWithMembership>(
      `/me/invitations/${invitationId}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ accept }),
      },
    )
  }

  async deleteAgentTool(projectId: string, id: string, toolId: string) {
    return this.fetchFromApi(
      `/projects/${projectId}/agents/${id}/tools/${toolId}`,
      {
        method: "DELETE",
      },
    )
  }

  async deleteAgentDatasource(
    projectId: string,
    id: string,
    datasourceId: string,
  ) {
    return this.fetchFromApi(
      `/projects/${projectId}/agents/${id}/datasources/${datasourceId}`,
      {
        method: "DELETE",
      },
    )
  }

  async deleteDatasource(id: string) {
    return this.fetchFromApi(`/datasources/${id}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async deleteResource(datasourceId: string, resourceId: string) {
    return this.fetchFromApi(
      `/datasources/${datasourceId}/resources/${resourceId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getResourceDownloadUrl(datasourceId: string, resourceId: string) {
    return this.fetchFromApi<{ download_url: string }>(
      `/datasources/${datasourceId}/resources/${resourceId}/download`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async deleteTool(id: string) {
    return this.fetchFromApi(`/tools/${id}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getDatasources() {
    return this.fetchFromApi<Datasource[]>(`/datasources`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getDatasource(id: string) {
    return this.fetchFromApi<Datasource>(`/datasources/${id}`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getResources(datasourceId: string) {
    return this.fetchFromApi<ResourceListResponse>(
      `/datasources/${datasourceId}/resources`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getResource(datasourceId: string, resourceId: string) {
    return this.fetchFromApi<Resource>(
      `/datasources/${datasourceId}/resources/${resourceId}`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async createResource(payload: ResourceCreate) {
    return this.fetchFromApi<Resource>(
      `/datasources/${payload.datasource_id}/resources`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async patchResource(payload: ResourceUpdate) {
    return this.fetchFromApi<Resource>(
      `/datasources/${payload.current_datasource_id}/resources/${payload.resource_id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getAnswerFilters(agentId: string) {
    return this.fetchFromApi<AnswerFilterListResponse>(
      `/agents/${agentId}/answer-filters`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async createAnswerFilter(payload: AnswerFilterCreate) {
    return this.fetchFromApi<AnswerFilter>(
      `/agents/${payload.agent_id}/answer-filters`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async patchAnswerFilter(payload: AnswerFilterUpdate) {
    return this.fetchFromApi<AnswerFilter>(
      `/agents/${payload.agent_id}/answer-filters/${payload.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async deleteAnswerFilter(payload: AnswerFilterDelete) {
    return this.fetchFromApi(
      `/agents/${payload.agent_id}/answer-filters/${payload.id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getGuardrails() {
    return this.fetchFromApi<GuardrailListResponse>(`/guardrails`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getAgentGuardrails(agentId: string) {
    return this.fetchFromApi<AgentGuardrailListResponse>(
      `/agents/${agentId}/guardrails`,
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async createAgentGuardrail(payload: AgentGuardrailCreate) {
    return this.fetchFromApi<AgentGuardrail>(
      `/agents/${payload.agent_id}/guardrails`,
      {
        method: "POST",
        body: JSON.stringify({
          id: payload.guardrail_id,
          priority: payload.priority,
        }),
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async deleteAgentGuardrail(payload: AgentGuardrailDelete) {
    return this.fetchFromApi(
      `/agents/${payload.agent_id}/guardrails/${payload.guardrail_id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
    )
  }

  async getLLMs() {
    return this.fetchFromApi<ModelsApiResponse>(`/llms`)
  }

  async getTools() {
    return this.fetchFromApi<Tool[]>(`/tools`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getTool(id: string) {
    return this.fetchFromApi<Tool>(`/tools/${id}`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async createTool(payload: ToolCreate) {
    return this.fetchFromApi(`/tools`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async patchTool(payload: ToolUpdate) {
    return this.fetchFromApi<Tool>(`/tools/${payload.tool_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getServiceApiKeys(serviceName: string) {
    return this.fetchFromApi(`/api-services/${serviceName}`)
  }

  async patchDatasource(payload: DatasourceUpdate) {
    return this.fetchFromApi(`/datasources/${payload.datasource_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async patchLLM(id: string, payload: any) {
    return this.fetchFromApi(`/llms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async getWorkflows(
    searchParams: { take?: number; skip?: number } = { skip: 0, take: 50 },
  ) {
    return this.fetchFromApi("/workflows", {}, searchParams)
  }

  async getWorkflowById(id: string) {
    return this.fetchFromApi(`/workflows/${id}`)
  }

  async createWorkflow(payload: any) {
    return this.fetchFromApi("/workflows", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async getWorkflowSteps(id: string) {
    return this.fetchFromApi(`/workflows/${id}/steps`)
  }

  async createWorkflowStep(workflowId: string, payload: any) {
    return this.fetchFromApi(`/workflows/${workflowId}/steps`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async createServiceApiKey(payload: any) {
    return this.fetchFromApi(`/api-services/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async patchWorkflowStep(workflowId: string, stepId: string, payload: any) {
    return this.fetchFromApi(`/workflows/${workflowId}/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async deleteWorkflowStep(workflowId: string, stepId: string) {
    return this.fetchFromApi(`/workflows/${workflowId}/steps/${stepId}`, {
      method: "DELETE",
    })
  }

  async patchWorkflow(workflowId: string, payload: any) {
    return this.fetchFromApi(`/workflows/${workflowId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async patchServiceApiKey(apiServiceId: string, payload: any) {
    return this.fetchFromApi(`/api-services/${apiServiceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async deleteWorkflow(workflowId: string) {
    return this.fetchFromApi(`/workflows/${workflowId}`, {
      method: "DELETE",
    })
  }

  async getVectorDbs() {
    return this.fetchFromApi(`/vector-dbs`)
  }

  async createVectorDb(payload: any) {
    return this.fetchFromApi("/vector-db", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async patchVectorDb(id: string, payload: any) {
    return this.fetchFromApi(`/vector-dbs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async getProjectRequests(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<RequestsByDay[]>(
      "/usage/requests",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getProjectThreads(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<ThreadsByDay[]>(
      "/usage/threads",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getLLMUsage(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<LLMUsage[]>(
      "/usage/llm",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getRerankUsage(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<RerankUsage[]>(
      "/usage/rerank",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getWebsearchUsage(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<WebsearchUsage[]>(
      "/usage/web-search",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getEmbeddingsUsage(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<EmbeddingsUsage[]>(
      "/usage/embeddings",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getTranscriptionUsage(searchParams: SearchParamsBase = {}) {
    return this.fetchFromApi<TranscriptionUsage[]>(
      "/usage/speech-to-text",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getScrapingUsage(
    searchParams: SearchParamsBase = {
      date_from: "",
      date_to: "",
    },
  ) {
    return this.fetchFromApi<ScrapingUsage[]>(
      "/usage/scraping",
      {
        headers: {
          authorization: `Bearer ${this.projectToken}`,
        },
      },
      searchParams,
    )
  }

  async getProjectBatches() {
    return this.fetchFromApi<Batch[]>("/batches", {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getBatch(batchId: string) {
    return this.fetchFromApi<Batch>(`/batches/${batchId}`, {
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async downloadBatchFiles(batchId: string) {
    return this.fetchFromApi<{
      output_file_url: string | undefined
      errors_file_url: string | undefined
    }>(`/batches/${batchId}/download`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${this.projectToken}`,
      },
    })
  }

  async getResourceScrapingStatus(resourceId: string) {
    return this.fetchFromApi<ScrapingStatus>(
      `/resources/${resourceId}/scraping-status`,
      {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      },
    )
  }

  async fetchBigQueryDatasets(service_account_info: BigQueryCredentials) {
    const { data, error } = await this.fetchFromApi<{
      dataset_ids: string[]
      project_id: string
    }>(`/bigquery/datasets`, {
      method: "POST",
      body: JSON.stringify({
        service_account_info,
      }),
    })

    if (error) {
      return { data: null, error }
    }

    const transformedData: BigQueryDatasetsResponse = {
      datasets: data?.dataset_ids
        ? data.dataset_ids.map((id: string) => ({
            id: id,
            name: id,
            projectId: data.project_id || "unknown",
          }))
        : [],
    }

    return { data: transformedData, error: null }
  }

  async fetchBigQueryTables(
    service_account_info: BigQueryCredentials,
    dataset_id: string,
  ) {
    const { data, error } = await this.fetchFromApi<{
      table_ids: string[]
    }>(`/bigquery/tables`, {
      method: "POST",
      body: JSON.stringify({
        service_account_info,
        dataset_id,
      }),
    })

    if (error) {
      return { data: null, error }
    }

    const transformedData: BigQueryTablesResponse = {
      tables: data?.table_ids
        ? data.table_ids.map((id: string) => ({
            id: id,
            name: id,
            type: "TABLE",
          }))
        : [],
    }

    return { data: transformedData, error: null }
  }
}

interface SearchParamsBase {
  date_from?: string
  date_to?: string
}
