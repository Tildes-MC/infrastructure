# Tildes MC Server Config/Deployment

## Cloning

```shell
git clone --recurse-submodules git@github.com:Tildes-MC/minecraft-server.git
```

## How to Set Up a Server

This has only been tested with deploying to a Debian 13 host.

1. Install ansible
2. Configure `ansible/group_vars/all/vars.yml` and `ansible/group_vars/all/vault.yml`
3. Encrypt the vault with `ansible-vault encrypt ansible/group_vars/all/vault.yml`
2. Install collections: `ansible-galaxy collection install -r ansible/requirements.yml`
3. Setup: `cd ansible && ansible-playbook playbooks/setup.yml --ask-vault-pass`

## How to Deploy Updates

### Website

```shell
cd ansible
ansible-playbook playbooks/deploy-web.yml --ask-vault-pass
```

### Minecraft

The Minecraft server is set to automatically restart daily. Most changes can
wait until then so by default deploying Minecraft will not restart the server.

You can optionally pass a `restart` flag to force an immediate restart:

```shell
cd ansible
ansible-playbook playbooks/deploy-minecraft.yml -e restart=true --ask-vault-pass
```
