/*
 * Copyright © 2022 Ben Petrillo. All rights reserved.
 *
 * Project licensed under the MIT License: https://www.mit.edu/~amini/LICENSE.md
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * All portions of this software are available for public use, provided that
 * credit is given to the original author(s).
 */

import {
    ApplicationCommandData,
    Client,
    CommandInteraction,
    GuildMember,
    MessageEmbed,
    StageChannel,
    VoiceChannel
} from "discord.js";
import {QueryType, Queue} from "discord-player";
import {ApplicationCommandOptionTypes} from "discord.js/typings/enums";
import {player} from "../Elixir";
import EmbedUtil from "../utils/EmbedUtil";
import Logger from "../structs/Logger";
import MusicPlayer from "../utils/MusicPlayer";
import Utilities from "../utils/Utilities";
import Command from "../structs/Command";

export default class PlayCommand extends Command {

    private readonly client: Client;

    constructor(client: Client) {
        super("play", {
            name: "play",
            description: "Play a track or playlist by URl or search query.",
            options: [
                {
                    name: "query",
                    description: "A URL or search query.",
                    type: ApplicationCommandOptionTypes.STRING,
                    required: true
                }
            ],
        });
        this.client = client;
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply();
        try {
            const track = interaction.options.getString("query");
            const member = interaction.member;
            if (member instanceof GuildMember) {
                const channel: VoiceChannel|StageChannel = member.voice.channel;
                if (!channel) {
                    const embed = EmbedUtil.getErrorEmbed("You must be in a voice channel.");
                    return void await interaction.editReply({embeds: [embed]});
                }
                const searchResult = await player.search(track, {requestedBy: interaction.user, searchEngine: QueryType.AUTO});
                const embed: MessageEmbed = EmbedUtil.getDefaultEmbed("Searching for your query...");
                await interaction.editReply({embeds: [embed]});
                if (!searchResult || !searchResult.tracks.length) {
                    const embed = EmbedUtil.getErrorEmbed("No search results found.");
                    return await interaction.followUp({embeds: [embed]});
                }
                if (searchResult.tracks[0].duration == "0:00") {
                    const embed = EmbedUtil.getErrorEmbed("Unfortunately, Elixir no longer supports livestreams.");
                    return void await interaction.channel.send({embeds: [embed]});
                }
                const queue: Queue = player.getQueue(interaction.guild)
                    ? player.getQueue(interaction.guild)
                    : player.createQueue(interaction.guild, MusicPlayer.getQueueInitOptions(interaction));
                if (searchResult.playlist) {
                    if (searchResult.playlist.tracks.length > 300) {
                        const embed = EmbedUtil.getErrorEmbed("You cannot add playlists with over 300 tracks.");
                        return void await interaction.followUp({embeds: [embed]});
                    } else searchResult.tracks[0].playlist = searchResult.playlist;
                }
                searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
                let initialConnection: boolean;
                try {
                    if (!queue.connection) {
                        initialConnection = true;
                        await queue.connect(member.voice.channel);
                    }
                } catch {
                    const embed = EmbedUtil.getErrorEmbed("Unable to join your voice channel.");
                    await player.deleteQueue(interaction.guild);
                    return await interaction.reply({embeds: [embed]});
                }
                if (initialConnection) await queue.play();
                MusicPlayer.setPlaying(queue, true);
            }
        } catch (error: any) {
            console.log(error)
            Utilities.sendWebhookMessage(error, true, interaction.guild.id);
            const embed = EmbedUtil.getErrorEmbed("An error occurred while running this command.");
            return void await interaction.followUp({embeds: [embed]});
        }
    }

    public getName(): string {
        return this.name;
    }

    public getCommandData(): ApplicationCommandData {
        return this.data;
    }
}