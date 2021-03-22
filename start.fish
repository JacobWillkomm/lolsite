#!/usr/bin/fish

# starts django in `dev` mode, runs worker, runs react server

# postgres and redis-server must be running
# create session `lolsite`
# assumes venv `lolsite`
set environ 'conda deactivate && conda activate lolsite'
tmux new-session -d -s lolsite
tmux send-keys "$environ && python manage.py rundev" C-m
tmux split-window -h
tmux send-keys "$environ && python manage.py celery" C-m
tmux split-window -c "./react/" -v 'npm run start'
tmux a -t lolsite
