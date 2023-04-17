

import axios, { AxiosResponse } from "axios";
import {TranslateParams} from "../types/translate.types";

export class TranslateAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.DEEPLAPI_BASEURL as string
  }

  async translate(data: TranslateParams): Promise<AxiosResponse> {
    const postData = JSON.stringify(data);
    console.log(postData);

    return new Promise<AxiosResponse>((resolve, reject) => {
      axios.post(`${this.baseURL}/translate`, postData, {
       headers: {
          'Content-Type': 'application/json'
        }
      }).then((response) => {
          resolve(response.data);
        }).catch(() => {
          reject(0);
        });
    });
  }
}
