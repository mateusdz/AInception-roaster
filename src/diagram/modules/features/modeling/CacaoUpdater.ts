import type CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import type EventBus from 'diagram-js/lib/core/EventBus';
import type { ConnectionLike } from 'diagram-js/lib/model/Types';

/**
 * This class is a module
 * - module's entry points:
 *    - cropConnection(..) triggered on actions => ('connection.layout','connection.create')
 * - goal:
 *    -
 */
export default class CacaoUpdater extends CommandInterceptor {
	_eventBus: EventBus;
	_connectionDocking: CroppingConnectionDocking;

	constructor(eventBus: EventBus, connectionDocking: CroppingConnectionDocking) {
		super(eventBus);
		this._eventBus = eventBus;
		this._connectionDocking = connectionDocking;
		this.executed(['connection.layout', 'connection.create'], (e: any) => {
			this.cropConnection(e);
		});
	}

	/**
	 * this is a method to crop the connection
	 * this method updates the docking points and put them along the border of the shape.
	 * @param e the event
	 */
	cropConnection(e: any) {
		const context: any = e.context;
		const hints: any = context.hints || {};
		let connection: ConnectionLike;

		if (!context.cropped && hints.createElementsBehavior !== false) {
			connection = context.connection;
			connection.waypoints = this._connectionDocking.getCroppedWaypoints(
				connection,
				connection.source,
				connection.target,
			);
			context.cropped = true;
		}
	}
}

CacaoUpdater.$inject = ['eventBus', 'connectionDocking'];
