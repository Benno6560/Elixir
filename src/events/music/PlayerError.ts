import player from "../../managers/MusicManager";
import EmbedUtil from "../../utils/EmbedUtil";
import client from "../../Elixir";

player.on("error", (channel, error) => {
    channel.send({embeds: [EmbedUtil.fetchEmbedByType(client, "error")]}).then(() => {});
});