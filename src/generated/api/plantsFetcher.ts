import { PlantsContext } from "./plantsContext";
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_HOST;

export type ErrorWrapper<TError> =
  | TError
  | { status: number; payload: unknown };

export type PlantsFetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
  url: string;
  method: string;
  body?: TBody;
  headers?: THeaders;
  queryParams?: TQueryParams;
  pathParams?: TPathParams;
  signal?: AbortSignal;
} & PlantsContext["fetcherOptions"];

export async function plantsFetch<
  TData,
  _TError,
  TBody extends {} | FormData | undefined | null,
  THeaders extends {},
  TQueryParams extends {},
  TPathParams extends {},
>({
  url,
  method,
  body,
  headers,
  pathParams,
  queryParams,
  signal,
}: PlantsFetcherOptions<
  TBody,
  THeaders,
  TQueryParams,
  TPathParams
>): Promise<TData> {
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  /**
   * As the fetch API is being used, when multipart/form-data is specified
   * the Content-Type header must be deleted so that the browser can set
   * the correct boundary.
   * https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object
   */
  if (
    requestHeaders["Content-Type"].toLowerCase().includes("multipart/form-data")
  ) {
    delete requestHeaders["Content-Type"];
  }

  let response;
  try {
    response = await axios({
      url: `${baseUrl}${resolveUrl(url, queryParams, pathParams)}`,
      method: method.toUpperCase(),
      data: body,
      headers: requestHeaders,
      signal,
      withCredentials: true,
    });
  } catch (requestError) {
    if (axios.isAxiosError(requestError)) {
      throw {
        status: requestError.response?.status ?? 500,
        payload: requestError.response?.data ?? requestError.message,
      };
    } else {
      throw {
        status: 500,
        payload: requestError,
      };
    }
  }

  return response.data;
}

const resolveUrl = (
  url: string,
  queryParams: Record<string, string> = {},
  pathParams: Record<string, string> = {}
) => {
  let query = new URLSearchParams(queryParams).toString();
  if (query) query = `?${query}`;
  return url.replace(/\{\w*\}/g, (key) => pathParams[key.slice(1, -1)]) + query;
};
