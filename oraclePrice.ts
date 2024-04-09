import axios from 'axios';
import {
	CosmWasmClient,
	MsgExecuteContractEncodeObject,
	SigningCosmWasmClient,
	SigningCosmWasmClientOptions,
} from '@cosmjs/cosmwasm-stargate'
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import {
	AccountData,
	coin,
  Coin,
	DirectSecp256k1HdWallet,
	EncodeObject,
	GeneratedType,
	Registry,
} from '@cosmjs/proto-signing'

import { HdPath } from '@cosmjs/crypto'


// mnemonic
const mnemonic = "chat enhance stock know air layer under rabbit lens pony clever glass";

// contract address
const contractAddress = "neutron15ldst8t80982akgr8w8ekcytejzkmfpgdkeq4xgtge48qs7435jqp87u3t";
//const contractAddress = "neutron1f86ct5az9qpz2hqfd5uxru02px2a3tz5zkw7hugd7acqq496dcms22ehpy";


//chain id
const chainId = "pion-1";

//blockchain rpc endpoint
const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";

interface PythUpdateExecuteMsg {
  update_price_feeds: { data: string[] }
}

type MsgExecuteContractValue = {
  sender: string;
  contract: string;
  msg: PythUpdateExecuteMsg;
  funds?: Coin[];
};


// simple datastructure for the response
interface ApiResponse {
  id: string;
  price: PriceInfo;
  ema_price: PriceInfo;
}

interface PriceInfo {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}


function replacer(key: string, value: any): any {
  const seen = new WeakSet();
  return (key: string, value: object) => {
      if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
              return;
          }
          seen.add(value);
      }
      return value;
  };
}


async function fetchData(): Promise<void> {
  try {
    // http 
    const response = await axios.get<ApiResponse[]>('https://hermes.pyth.network/api/latest_price_feeds?ids[]=b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819&ids[]=a8e6517966a52cb1df864b2764f3629fde3f21d2b640b5c572fcd654cbccd65e');
    const feedIds : string[] =  [];
  
    // console.log(response.data);

    response.data.forEach((asset) => {
      console.log(`Id: ${asset.id}`);
      console.log(`Price: ${asset.price.price}`);
      console.log(`Expo: ${asset.price.expo}`);
      let price = asset.price.price;
      let expo = asset.price.expo; // -8 , -7, -6, +100
      let feedId = asset.id; 
      // convert the price
      if (expo < 0) {
        let result = Number(price) / Math.pow(10, Math.abs(expo));
        console.log(`Result: ${result}`);
        //Determine the orders that should be executed
        feedIds.push(feedId)
        
      }

    });

    console.log(feedIds);
    //const vaas = await axios.get<ApiResponse[]>('https://hermes.pyth.network/api/latest_vaas?ids[]=b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819&ids[]=a8e6517966a52cb1df864b2764f3629fde3f21d2b640b5c572fcd654cbccd65e');
    const vaas = await axios.get<ApiResponse[]>('https://hermes.pyth.network/api/latest_vaas?ids[]=b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819');

    console.log(vaas.data[0]);
    let request_data = vaas.data[0]

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'neutron' });

    // neutron
    const cosmwasmClient = await SigningCosmWasmClient.connectWithSigner(
      rpcEndpoint,
      wallet,
      {
        gasPrice: GasPrice.fromString('0.25untrn'),
      }
    );
    // get wallet address
    const addresses = await wallet.getAccounts();
    const address = addresses[0].address;
    console.log('address:' + address)

    const account = await cosmwasmClient.getAccount(address);
    console.log('account sequence:' + account.sequence)


    const txResponse = await cosmwasmClient.execute(
      account.address,
      contractAddress,
      {
        'update_price_feeds': {
          'data': [request_data]
        }
      },
      'auto',
      '',
      [coin(1, 'untrn')]
    );
     
   
    console.log(txResponse)
    
    //console.log(`Transformed data: ${data}, point: ${point}`);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// cron job
setInterval(fetchData, 5000);
