import {
	CasesConnectionExtension,
	type CasesConnectionExtensionProps,
} from './CasesConnectionExtension';
import type { ConnectionExtensionProps, ConnectionExtension } from './ConnectionExtension';
import {
	NextStepsConnectionExtension,
	type NextStepsConnectionExtensionProps,
} from './NextStepsConnectionExtension';
import {
	OnCompletionConnectionExtension,
	type OnCompletionConnectionExtensionProps,
} from './OnCompletionConnectionExtension';
import {
	OnFailureConnectionExtension,
	type OnFailureConnectionExtensionProps,
} from './OnFailureConnectionExtension';
import {
	OnFalseConnectionExtension,
	type OnFalseConnectionExtensionProps,
} from './OnFalseConnectionExtension';
import {
	OnSuccessConnectionExtension,
	type OnSuccessConnectionExtensionProps,
} from './OnSuccessConnectionExtension';
import {
	OnTrueConnectionExtension,
	type OnTrueConnectionExtensionProps,
} from './OnTrueConnectionExtension';

export abstract class ConnectionExtensionFactory {
	static create(props: Partial<ConnectionExtensionProps>): ConnectionExtension {
		switch (props.type) {
			case 'on_completion':
				return new OnCompletionConnectionExtension(
					props as OnCompletionConnectionExtensionProps,
				);
			case 'on_success':
				return new OnSuccessConnectionExtension(props as OnSuccessConnectionExtensionProps);
			case 'on_failure':
				return new OnFailureConnectionExtension(props as OnFailureConnectionExtensionProps);
			case 'on_true':
				return new OnTrueConnectionExtension(props as OnTrueConnectionExtensionProps);
			case 'on_false':
				return new OnFalseConnectionExtension(props as OnFalseConnectionExtensionProps);
			case 'cases':
				return new CasesConnectionExtension(props as CasesConnectionExtensionProps);
			case 'next_steps':
				return new NextStepsConnectionExtension(props as NextStepsConnectionExtensionProps);
			default:
				throw new Error(`Unknown connection type: ${props.type}`);
		}
	}
}
