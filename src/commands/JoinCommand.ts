import {Client, CommandInteraction, GuildMember} from "discord.js";
import {ICommand} from "../interfaces/ICommand";
import EmbedUtil from "../utils/EmbedUtil";
import VoiceManager from "../managers/VoiceManager";
import Logger from "../Logger";

export default class JoinCommand implements ICommand {

    public name: string = "join";
    public description: string = "Have Elixir join the voice channel.";
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        if (!interaction.isCommand()) return;
        if (interaction.commandName === this.name) {
            try {
                const member = interaction.member;
                if (member instanceof GuildMember) {
                    if (!member.voice.channel) {
                        const embed = EmbedUtil.getErrorEmbed("You must be in a voice channel.");
                        return await interaction.reply({embeds: [embed]});
                    } else {
                        const channel = member.voice.channel;
                        await VoiceManager.connectToVoiceChannel(channel);
                        const embed = EmbedUtil.getDefaultEmbed("I've joined and bound myself to the voice channel.");
                        return await interaction.reply({embeds: [embed]});
                    }
                } else {
                    return await interaction.reply({content: "This command must be run in a guild."});
                }
            } catch (error: any) {
                Logger.error(error);
                const embed = EmbedUtil.getErrorEmbed("I'm unable to join the voice channel.");
                return await interaction.reply({embeds: [embed]});
            }
        }
    }

    public getSlashData(): object {
        return this.slashData;
    }

    public slashData: object = {
        name: this.name,
        description: this.description
    };
}