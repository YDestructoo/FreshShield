import { subnetCandidates } from './discovery';

const hosts = subnetCandidates('192.168.1.50');
if (hosts.length !== 253 || hosts.includes('192.168.1.50') || hosts.includes('192.168.1.0') || hosts.includes('192.168.1.255')) throw new Error('subnet candidates are invalid');
if (hosts[0] !== '192.168.1.1' || hosts.at(-1) !== '192.168.1.254') throw new Error('subnet candidates are not ordered');
try { subnetCandidates('8.8.8.8'); throw new Error('public address accepted'); } catch (error) { if ((error as Error).message === 'public address accepted') throw error; }
console.log('discovery subnet scenarios passed');
