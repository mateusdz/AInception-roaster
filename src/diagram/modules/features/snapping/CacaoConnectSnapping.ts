import { mid } from 'diagram-js/lib/features/snapping/SnapUtil';
import { isCmd } from 'diagram-js/lib/features/keyboard/KeyboardUtil';
import type EventBus from 'diagram-js/lib/core/EventBus';
import type { Shape } from 'diagram-js/lib/model/Types';
import type { CacaoConnectionType } from '../../../elements/connections/CacaoBaseConnection';

var HIGHER_PRIORITY = 1250;

/**
 * This class is a module
 * - module's entry points:
 *    - drawConnection(..) & drawShape(...)
 * - goal:
 *    - it render all the cacao constructs and cacao connection
 */
export default class CacaoConnectSnapping {
	private _eventBus: EventBus;
	static $inject: string[];

	constructor(eventBus: EventBus) {
		this._eventBus = eventBus;
		this.bindEvents();
	}

	/**
	 * this method bind all the events:
	 *  - this event snap any connection to the center of the connected shapes
	 */
	private bindEvents() {
		this._eventBus.on(
			['cacaoConnect.hover', 'cacaoConnect.move', 'cacaoConnect.end'],
			HIGHER_PRIORITY,
			(event: any) => {
				const context: any = event.context;
				const canExecute: boolean | CacaoConnectionType = context.canExecute;
				const start: Shape = context.start;
				const target: any = context.target;

				// Do NOT snap on CMD
				if (event.originalEvent && isCmd(event.originalEvent)) {
					return;
				}

				// Snap connection end
				if (canExecute && target) {
					const midTarget = mid(target, null);
					event.x = midTarget.x;
					event.y = midTarget.y;
				}

				// Snap connection start
				if (canExecute && start && context.connectionStart) {
					const midStart = mid(start, null);
					context.connectionStart.x = midStart.x;
					context.connectionStart.y = midStart.y;
				}
			},
		);
	}
}

CacaoConnectSnapping.$inject = ['eventBus'];
