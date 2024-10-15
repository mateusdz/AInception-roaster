import { DataMarking, type DataMarkingProps } from './DataMarking';
import { MarkingIep, type MarkingIepProps } from './MarkingIep';
import { MarkingStatement, type MarkingStatementProps } from './MarkingStatement';
import { MarkingTlp, type MarkingTlpProps } from './MarkingTlp';

export abstract class DataMarkingFactory {
	static create(props: any): any {
		const props2: DataMarkingProps = props as DataMarkingProps;
		switch (props2.type) {
			case 'marking-statement':
				return new MarkingStatement(props as MarkingStatementProps);
			case 'marking-tlp':
				return new MarkingTlp(props as MarkingTlpProps);
			case 'marking-iep':
				return new MarkingIep(props as unknown as MarkingIepProps);
			default:
				throw new Error(`Unknown data marking type: ${props.type}`);
		}
	}
}
