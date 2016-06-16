from setuptools import setup

setup(
    name='guzzle_sphinx_theme',
    version='0.7.11',
    description='Sphinx theme used by Guzzle.',
    long_description=open('README.rst').read(),
    author='Michael Dowling',
    author_email='mtdowling@gmail.com',
    url='https://github.com/guzzle/guzzle_sphinx_theme',
    packages=['guzzle_sphinx_theme'],
    include_package_data=True,
    install_requires=['Sphinx>=1.2b1'],
    classifiers=(
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python',
    ),
)
