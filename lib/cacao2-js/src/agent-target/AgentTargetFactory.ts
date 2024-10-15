import { AgentTarget, type AgentTargetProps } from './AgentTarget';
import { Group, type GroupProps } from './Group';
import { HttpApi, type HttpApiProps } from './HttpApi';
import { Individual, type IndividualProps } from './Individual';
import { Linux, type LinuxProps } from './Linux';
import { Location, type LocationProps } from './Location';
import { NetAddress, type NetAddressProps } from './NetAddress';
import { Organization, type OrganizationProps } from './Organization';
import { Sector, type SectorProps } from './Sector';
import { SecurityCategory, type SecurityCategoryProps } from './SecurityCategory';
import { Ssh, type SshProps } from './Ssh';

export abstract class AgentTargetFactory {
	static create(props: Partial<AgentTargetProps>): AgentTarget {
		switch (props.type) {
			case 'group':
				return new Group(props as GroupProps);
			case 'http-api':
				return new HttpApi(props as HttpApiProps);
			case 'individual':
				return new Individual(props as IndividualProps);
			case 'linux':
				return new Linux(props as LinuxProps);
			case 'location':
				return new Location(props as LocationProps);
			case 'net-address':
				return new NetAddress(props as NetAddressProps);
			case 'organization':
				return new Organization(props as OrganizationProps);
			case 'sector':
				return new Sector(props as SectorProps);
			case 'security-category':
				return new SecurityCategory(props as SecurityCategoryProps);
			case 'ssh':
				return new Ssh(props as SshProps);
			default:
				return new AgentTarget(props as AgentTargetProps);
		}
	}
}
