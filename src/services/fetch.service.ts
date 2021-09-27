import axios from 'axios';

class FetchService {
  public static async get(url: string): Promise<any> {
    const response = await axios.get(url);
    return response.data;
  }
}

export default FetchService;
