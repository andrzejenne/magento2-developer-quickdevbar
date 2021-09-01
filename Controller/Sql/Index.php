<?php
namespace ADM\QuickDevBar\Controller\Sql;

use ADM\QuickDevBar\Model\Storage;

class Index extends \ADM\QuickDevBar\Controller\Index
{
    /**
     * @var Storage
     */
    private $storage;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \ADM\QuickDevBar\Helper\Data $qdbHelper,
        \Magento\Framework\Controller\Result\RawFactory $resultRawFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        Storage $storage
    ) {
        parent::__construct($context, $qdbHelper, $resultRawFactory, $layoutFactory);
        $this->storage = $storage;
    }

    public function execute()
    {
        $jsons = $this->storage->getList();
        $files = [];
        foreach ($jsons as $json) {
            $head = \json_decode(file_get_contents($json), true);
            $head['file'] = basename($json);
            $files[basename($json, '.head.json')] = $head;
        }

        ksort($files, SORT_NUMERIC);

        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents(
            \json_encode($files)
        )->setHeader('Content-Type', 'application/json');
    }
}
