import { Message, MessageTypes } from "whatsapp-web.js";
import Yagami from "./Yagami";

export type CommandAction = (message: Message, client?: Yagami) => Promise<any>;

export type CheckRule = "exactly" | "startsWith" | "includes";

export type TriggerType = {
    mainText: string;
    mainCheckRule: CheckRule;
    inGroup?: MessageProps | MessageProps[];
    inPrivateChat?: MessageProps | MessageProps[];
    inAnyChat?: MessageProps | MessageProps[];
};

type RequireAtLeastOne<T, R extends keyof T = keyof T> = Omit<T, R> &
    { [P in R]: Required<Pick<T, P>> & Partial<Omit<T, P>> }[R];

export type MessageProps = RequireAtLeastOne<
    {
        body?: BodyCheckProps;
        type?: MessageTypes | MessageTypes[];
        hasQuotedMsg?: boolean;
    },
    "body" | "type"
>;

export type BodyCheckProps = {
    checkRule: CheckRule;
    text: string | string[];
};

export type CommandAttributes = {
    trigger: TriggerType;
    action: CommandAction;
    restricted: boolean;
    help: string;
    countAsCommandExecuted: boolean;
};

export default class Command {
    constructor(
        public description: string,
        public attributes: CommandAttributes
    ) {
        this.description = description;
        this.attributes = attributes;
    }
}
