<?php
declare(strict_types=1);

namespace ADM\QuickDevBar\Model;

use Magento\Framework\Filesystem\DirectoryList;

class Storage
{
    /**
     * @var string
     */
    private $outputDir;

    /**
     * @param DirectoryList $dir
     * @throws \Magento\Framework\Exception\FileSystemException
     */
    public function __construct(DirectoryList $dir)
    {
        $this->outputDir = $dir->getPath('var') . DIRECTORY_SEPARATOR . 'db-profiler' . DIRECTORY_SEPARATOR;

        if (!file_exists($this->outputDir)) {
            mkdir($this->outputDir, 0777, true);
        }
    }

    /**
     * @param string $name
     * @param string $type
     * @return false|string
     */
    public function load(string $name, string $type = 'head')
    {
        return \file_get_contents($this->outputDir . $name . '.' . $type . '.json', true);
    }

    /**
     * @param string $name
     * @param array  $data
     * @param string $type
     * @return false|int
     */
    public function save(string $name, array $data, string $type = 'head')
    {
        return \file_put_contents($this->outputDir . $name . '.' . $type . '.json', \json_encode($data));
    }

    /**
     * @param string $type
     * @return array|false
     */
    public function getList(string $type = 'head')
    {
        return \glob($this->outputDir . '*.' . $type . '.json');
    }

    /**
     * @return int|void
     */
    public function clear(): int
    {
        $files = \glob($this->outputDir . '*.{head,data}.json');
        if ($files === false) {
            return 0;
        }

        array_map('unlink', $files);

        return count($files);
    }

    /**
     * @param string $name
     * @return bool
     */
    public function exists(string $name): bool
    {
        $headPath = $this->outputDir . $name . '.head.json';
        $dataPath = $this->outputDir . $name . '.data.json';

        return file_exists($headPath) && file_exists($dataPath);
    }

}
