module.exports = async ({
  getNamedAccounts,
  deployments,
}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  await deploy('NFTLegends', {
    from: deployer,
    gasLimit: 4000000,
    args: [],
    log: true,
  });
};
