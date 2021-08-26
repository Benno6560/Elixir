import * as Discord from "discord.js";
import {Client} from "discord.js";
import DeployUtil from "../slash/DeployUtil";
import config from "../resources/Config";

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction, client) {

        if (!interaction.isCommand()) return;

        if (interaction.user.id !== config.developer.owner) {

            return await interaction.reply({content: "You must be a bot developer to run this command."});

        }

        if (interaction.commandName === "deploy") {

            await DeployUtil.deployAllSlashCommands(client, false);
            await interaction.reply({content: "Slash commands successfully deployed."});

        }

    }
}