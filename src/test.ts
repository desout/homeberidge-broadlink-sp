import * as broadlink from 'node-broadlink';


const testFunc = async () => {
  const devices = await broadlink.discover(undefined );
  console.log('find', devices);
};

testFunc().then();