import { useEffect } from 'react';
import { ping } from '../services/api';

export default function TestPing() {
  useEffect(() => {
    ping()
      .then((res) => console.log('PING OK', res))
      .catch((err) => console.error('PING ERROR', err));
  }, []);

  return null;
}