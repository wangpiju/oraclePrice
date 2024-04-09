import axios from 'axios';

// simple datastructure for the response
interface ApiResponse {
  data: number;
  point: number;
}

async function fetchData(): Promise<void> {
  try {
    // http 
    const response = await axios.get<ApiResponse>('https://hermes.pyth.network/api/latest_price_feeds?ids[]=b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819&ids[]=a8e6517966a52cb1df864b2764f3629fde3f21d2b640b5c572fcd654cbccd65e');
    console.log(`Response: ${response}`);
    let { data, point } = response.data;
    
    // convert the price
    if (point < 0) {
      data = data / Math.pow(10, Math.abs(point));
    }
    
    console.log(`Transformed data: ${data}, point: ${point}`);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// cron job
setInterval(fetchData, 1000);
