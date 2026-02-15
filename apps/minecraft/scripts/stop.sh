#!/bin/bash

tmux send-keys -t minecraft 'stop' Enter

# Wait for Minecraft to terminate
while pgrep -u daniel -f paper.jar > /dev/null; do
	sleep 1
done
