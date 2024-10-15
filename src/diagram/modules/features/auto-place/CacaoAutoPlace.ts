import type EventBus from 'diagram-js/lib/core/EventBus';
import type { Connection, ElementLike, Shape, ShapeLike } from 'diagram-js/lib/model/Types';
import { type Rect, asTRBL, getOrientation } from 'diagram-js/lib/layout/LayoutUtil';
import AutoPlace from 'diagram-js/lib/features/auto-place/AutoPlace';
import type Canvas from 'diagram-js/lib/core/Canvas';
import type { Point } from 'diagram-js/lib/core/Canvas';
import type CacaoModeling from '../modeling/CacaoModeling';
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import CacaoUtils from '../../core/CacaoUtils';
import type PlaybookHandler from '../../model/PlaybookHandler';
import { type SwitchConditionStep, WorkflowStep } from 'lib/cacao2-js';
import { CoordinatesExtension } from '../../model/coordinates-extension/CoordinatesExtension';
import type { CacaoConnectionType } from 'src/diagram/elements/connections/CacaoBaseConnection';
import type { ConnectionExtension } from '../../model/coordinates-extension/ConnectionExtension';
import type { CasesConnectionExtension } from '../../model/coordinates-extension/CasesConnectionExtension';
import type { NextStepsConnectionExtension } from '../../model/coordinates-extension/NextStepsConnectionExtension';
/**
 * This class is a module
 * - module's entry points:
 *    - event("autoPlace")
 * - goal:
 *    - it provides a position to place a shape depending on its source's connection
 */
export default class CacaoAutoPlace extends AutoPlace {
	_eventBus: EventBus;
	_modeling: CacaoModeling;

	private HORIZONTAL_MARGIN_BETWEEN_SHAPES = 130;
	private VERTICAL_MARGIN_BETWEEN_SHAPES = 200;
	private _elementRegistry: ElementRegistry;
	private _playbookHandler: PlaybookHandler;

	constructor(
		eventBus: EventBus,
		modeling: CacaoModeling,
		canvas: Canvas,
		elementRegistry: ElementRegistry,
		playbookHandler: PlaybookHandler,
	) {
		super(eventBus, modeling, canvas);
		this._eventBus = eventBus;
		this._modeling = modeling;
		this._elementRegistry = elementRegistry;
		this._playbookHandler = playbookHandler;
		this.bindEvents();
	}

	bindEvents() {
		this._eventBus.on('autoPlace', (event: any) => {
			const shape = event.shape;
			const source = event.source;

			return this.getNextShapePosition(source, shape);
		});
	}

	/**
	 * this method handles the autoPlace
	 *  It creates the new shapes with a calculated position. This position will come form the extension if it exist
	 *  It connect the two shapes with the provided connectionType
	 * @param source the source of the new connection
	 * @param shape this new shape, the target of the new connection
	 * @param connectionType the type of the new connection
	 * @returns the newly created shape
	 */
	appendShape(source: ShapeLike, shape: ShapeLike, connection: Partial<Connection>): ShapeLike {
		let initialPosition;

		try {
			const workflowStep = this._playbookHandler.playbook.workflow[shape?.id];
			if (workflowStep) {
				const coordinatesExtension = this._playbookHandler.getCoordinatesExtension(
					shape.id,
				);
				if (coordinatesExtension && coordinatesExtension.x && coordinatesExtension.y) {
					initialPosition = {
						x: coordinatesExtension.x,
						y: coordinatesExtension.y,
					};
				}
			}
		} catch (_) {}

		if (initialPosition == undefined) {
			// Get the calculated position
			initialPosition = this.getNextShapePosition(source as Shape, shape as Shape);
		}

		var newShape = this._modeling.appendShape(
			source as any,
			shape,
			initialPosition,
			source.parent,
			connection,
		);

		return newShape;
	}

	/**
	 * this method return a position available on the canvas for the provided shape. It will use the position stored in coordinates extension
	 * @returns
	 */
	getFirstShapePosition(shape: Shape): Point {
		let initialPosition;

		try {
			const workflowStep = this._playbookHandler.playbook.workflow[shape?.id];
			if (workflowStep) {
				const coordinatesExtension = this._playbookHandler.getCoordinatesExtension(
					shape.id,
				);
				if (coordinatesExtension && coordinatesExtension.x && coordinatesExtension.y) {
					initialPosition = {
						x: coordinatesExtension.x,
						y: coordinatesExtension.y,
					};
				}
			}
		} catch (_) {}

		if (initialPosition == undefined) {
			initialPosition = {
				x: 300,
				y: window.screen.height / 2 - shape.height / 2,
			};
		}

		const position = this.getValidShapePosition(shape, initialPosition);
		return position;
	}

	/**
	 * this method try to get the coordinates stored in the coordinates extension, if it is not defined, it will return an empty array
	 * @param stepId
	 * @param nextStepId
	 * @param connectionType
	 * @returns
	 */
	getConnectionWaypoints(
		stepId: string,
		nextStepId: string,
		connectionType: CacaoConnectionType,
	): Point[] {
		try {
			const workflowStep = this._playbookHandler.playbook.workflow[stepId];
			if (workflowStep == undefined) {
				return [];
			}
			const coordinateExtension = this._playbookHandler.getCoordinatesExtension(stepId);
			if (!coordinateExtension) {
				return [];
			}

			const convertInWaypoints = (connectionExtension: ConnectionExtension): Point[] => {
				const waypoints: Point[] = [];
				for (let index = 0; index < connectionExtension.x.length; index++) {
					waypoints.push({
						x: connectionExtension.x[index],
						y: connectionExtension.y[index],
					});
				}
				return waypoints;
			};
			for (const connectionExtension of coordinateExtension.outgoing_connections) {
				if (connectionExtension.type == connectionType) {
					switch (connectionExtension.type as any) {
						case 'cases':
							const casesExt = connectionExtension as CasesConnectionExtension;
							if (
								(workflowStep as SwitchConditionStep)?.cases[casesExt.case] ==
								nextStepId
							) {
								return convertInWaypoints(connectionExtension);
							}
							break;
						case 'next-steps':
							const parallelExt = connectionExtension as NextStepsConnectionExtension;
							if (parallelExt.next_step == nextStepId) {
								return convertInWaypoints(connectionExtension);
							}
							break;
						default:
							return convertInWaypoints(connectionExtension);
							break;
					}
				}
			}
		} catch (_) {}

		return [];
	}

	/**
	 * this method returns a valid position for the target element depending on the position of the source
	 * @param source
	 * @param target element to place
	 * @returns Point: the position
	 */
	private getNextShapePosition(source: Shape, target: Shape): Point {
		const sourceTrbl = asTRBL(source);

		var position = {
			x: sourceTrbl.right + this.HORIZONTAL_MARGIN_BETWEEN_SHAPES,
			y: sourceTrbl.top + source.height / 2 - target.height / 2,
		};

		return this.getValidShapePosition(target, position);
	}

	/**
	 * return a position valid to place the shape
	 * @param shape
	 * @param position
	 * @returns
	 */
	private getValidShapePosition(shape: Shape, position: Point): Point {
		var nextPositionDirection = {
			y: this.VERTICAL_MARGIN_BETWEEN_SHAPES,
		};

		while (this.isPositionWithConflicts(shape, position)) {
			position.y += nextPositionDirection.y;
		}

		return position;
	}

	/**
	 * return a boolean to say if the shape can be place at the position without any conflict with the existing shape
	 * @param shape
	 * @param position
	 * @returns True if the shape can be place ther, False otherwize
	 */
	private isPositionWithConflicts(shape: Shape, position: Point) {
		var bounds = {
			x: position.x - shape.width / 2,
			y: position.y - shape.height / 2,
			width: shape.width,
			height: shape.height,
		};

		const list = this._elementRegistry.getAll();
		for (const element of list) {
			if (CacaoUtils.isConstructType(element.type)) {
				const orientation = getOrientation(element as any, bounds, 10);
				if (orientation === ('intersect' as any)) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * get bounds for the element and all its children
	 * @param element
	 * @returns Rect: a bounds
	 */
	private getHeritateBounds(element: ElementLike): Rect {
		const bounds = {
			x: element.x - element.width / 2,
			y: element.y - element.height / 2,
			width: element.width,
			height: element.height,
		};

		for (const connection of element.outgoing) {
			const target = connection.target;
			if (target && CacaoUtils.isConstructType(target.type)) {
				const childBounds = this.getHeritateBounds(target);
				if (childBounds.x < bounds.x) {
					bounds.width = bounds.x - childBounds.x + bounds.width;
					bounds.x = childBounds.x;
				} else {
					bounds.width = childBounds.x - bounds.x + childBounds.width;
				}

				if (childBounds.y < bounds.y) {
					bounds.height = bounds.y - childBounds.y + bounds.height;
					bounds.y = childBounds.y;
				} else {
					bounds.height = childBounds.y - bounds.y + childBounds.height;
				}
			}
		}
		return bounds;
	}
}

CacaoAutoPlace.$inject = ['eventBus', 'modeling', 'canvas', 'elementRegistry', 'playbookHandler'];
